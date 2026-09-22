import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

import { createAc265HostedArtifactSourceAuthority } from './ac265-hosted-artifact-source-manifest.ts';
import {
  assertAc265Projection,
  createDefaultPublicationRpc,
  createPublicationManifest,
  digestAc265PublicationBytes,
  protectedFinalizationRef,
  protectedIdempotencyRef,
  reauthenticatePublicationManifest,
  sourceControlRequests,
  type Ac265FinalizedProjection,
} from './publish-ac265-hosted-artifact-source-manifest-core.ts';
import { AC265_PUBLICATION_FAILURE } from './publish-ac265-hosted-artifact-source-manifest-context.ts';
import { readAc265ProtectedArtifactSources } from './publish-ac265-hosted-artifact-source-manifest-support.ts';
import {
  readAc265SigningPrivateKey,
  writeAc265PrivateBundle,
} from './publish-ac265-hosted-artifact-source-manifest-io.ts';
import {
  loadAc265ProtectedPublicationContext,
  requiredAc265Env,
  type Ac265PublishOptions,
} from './publish-ac265-hosted-artifact-source-manifest-loader.ts';

const fail = (): never => {
  throw new Error(AC265_PUBLICATION_FAILURE);
};

export const publishAc265HostedArtifactSourceManifest = async (
  options: Ac265PublishOptions,
): Promise<string> => {
  try {
    const context = await loadAc265ProtectedPublicationContext(
      options,
      false,
      true,
    );
    const ciDirectory = options.env['AC265_SOURCE_MANIFEST_CI_SOURCE_DIR'];
    const sourceDirectory =
      options.env['AC265_SOURCE_MANIFEST_SOURCE_DIR'] ??
      (typeof ciDirectory === 'string'
        ? dirname(ciDirectory)
        : requiredAc265Env(options.env, 'AC265_SOURCE_MANIFEST_CI_SOURCE_DIR'));
    const manifestAuthority = createAc265HostedArtifactSourceAuthority(
      context.authority,
    );
    if (
      manifestAuthority.manifest.authorizationRef !==
        context.authorizationRef ||
      manifestAuthority.manifest.runId !== context.candidate.runId ||
      manifestAuthority.manifest.candidateIdentitySha256 !==
        context.candidate.identitySha256 ||
      manifestAuthority.manifest.sourceRevision !== context.sourceRevision ||
      manifestAuthority.manifest.deploymentId !==
        context.candidate.deploymentId ||
      manifestAuthority.manifest.runnerContractSha256 !==
        context.candidate.runnerContractSha256 ||
      manifestAuthority.manifest.issuedAt !==
        context.authorization.authorizedAt ||
      manifestAuthority.manifest.expiresAt !== context.authorization.expiresAt
    )
      return fail();
    const sources = readAc265ProtectedArtifactSources({
      context,
      sourceDirectory,
      manifestSources: manifestAuthority.manifest.sources,
    });
    const resolver = manifestAuthority.createResolver(sources);
    const resolved = manifestAuthority.manifest.sources.map((source) => {
      const request = {
        ref: source.artifactRef,
        reportStartedAt: context.authorization.authorizedAt,
        expectedSubjectSha256: source.subjectSha256,
      };
      return source.kind === 'server_receipt'
        ? resolver.resolveReceipt(request)
        : resolver.resolveEvidence(request);
    });
    const request = {
      criterion: 'P2-S09-AC-265' as const,
      schemaVersion: 'ac265-hosted-artifact-source-manifest-v1' as const,
      authorizationRef: context.authorizationRef,
      idempotencyRef: protectedIdempotencyRef(context),
      sources: sourceControlRequests(manifestAuthority.manifest, resolved),
    };
    const supabaseProjectRef = requiredAc265Env(
      options.env,
      'SUPABASE_PROJECT_REF',
    );
    const rpc =
      options.rpc ??
      createDefaultPublicationRpc({
        supabaseUrl: requiredAc265Env(options.env, 'SUPABASE_URL'),
        supabaseProjectRef,
        serviceRoleKey: requiredAc265Env(options.env, 'SUPABASE_SECRET_KEY'),
        ...(options.fetchImpl === undefined
          ? {}
          : { fetchImpl: options.fetchImpl }),
      });
    const privateKeyPem = readAc265SigningPrivateKey(
      options.env['AC265_SOURCE_MANIFEST_SIGNING_PRIVATE_KEY_PEM'],
    );
    if (
      requiredAc265Env(options.env, 'AC265_SOURCE_MANIFEST_SIGNING_KEY_ID') !==
      manifestAuthority.manifest.authorityKeyId
    )
      return fail();
    const registered = await rpc.register(request);
    assertAc265Projection(registered, context, request, supabaseProjectRef);
    let final: Ac265FinalizedProjection;
    if (registered.lifecycle === 'finalized') {
      const created = createPublicationManifest(
        registered,
        context,
        privateKeyPem,
      );
      if (
        digestAc265PublicationBytes(created.manifestBytes) !==
        registered.manifestSha256
      )
        return fail();
      reauthenticatePublicationManifest(created.manifestBytes, context);
      final = registered;
    } else {
      if (
        registered.manifestSha256 !== null ||
        registered.finalizationRef !== null ||
        registered.finalizedAt !== null
      )
        return fail();
      const created = createPublicationManifest(
        registered,
        context,
        privateKeyPem,
      );
      const manifestSha256 = digestAc265PublicationBytes(created.manifestBytes);
      const finalization = protectedFinalizationRef(
        context,
        options.uuid ?? randomUUID,
      );
      final = await rpc.finalize({
        criterion: 'P2-S09-AC-265',
        schemaVersion: 'ac265-hosted-artifact-source-manifest-v1',
        authorizationRef: context.authorizationRef,
        manifestId: registered.manifestId,
        finalizationRef: finalization,
        manifestSha256,
      });
      assertAc265Projection(final, context, request, supabaseProjectRef);
      if (
        final.lifecycle !== 'finalized' ||
        final.manifestSha256 !== manifestSha256 ||
        final.finalizationRef !== finalization
      )
        return fail();
      reauthenticatePublicationManifest(created.manifestBytes, context);
    }
    if (final.lifecycle !== 'finalized') return fail();
    const readback = await rpc.read({
      criterion: 'P2-S09-AC-265',
      schemaVersion: 'ac265-hosted-artifact-source-manifest-v1',
      authorizationRef: context.authorizationRef,
      manifestId: final.manifestId,
    });
    assertAc265Projection(readback, context, request, supabaseProjectRef);
    if (
      readback.lifecycle !== 'finalized' ||
      readback.manifestSha256 !== final.manifestSha256 ||
      readback.finalizationRef !== final.finalizationRef ||
      readback.finalizedAt !== final.finalizedAt ||
      readback.registeredAt !== final.registeredAt
    )
      return fail();
    const created = createPublicationManifest(final, context, privateKeyPem);
    if (
      digestAc265PublicationBytes(created.manifestBytes) !==
      final.manifestSha256
    )
      return fail();
    reauthenticatePublicationManifest(created.manifestBytes, context);
    const bundle = Buffer.from(
      JSON.stringify({
        schemaVersion: 'ac265-hosted-artifact-source-manifest-bundle-v1',
        criterion: 'P2-S09-AC-265',
        manifestSha256: final.manifestSha256,
        manifestBytesBase64: Buffer.from(created.manifestBytes).toString(
          'base64',
        ),
        finalized: final,
      }),
      'utf8',
    );
    return writeAc265PrivateBundle(
      requiredAc265Env(options.env, 'AC265_SOURCE_MANIFEST_OUTPUT_DIR'),
      bundle,
    );
  } catch {
    return fail();
  }
};
