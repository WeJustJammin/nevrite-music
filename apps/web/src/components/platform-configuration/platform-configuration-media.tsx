import * as React from 'react';

/** Configuration values have no media surface; this boundary documents the shared media rules. */
export function PlatformConfigurationMediaPolicy(): React.ReactElement {
  return (
    <p
      className="platform-configuration-help"
      data-media-policy="captions transcript pause reduced motion waveform"
    >
      No media is required for configuration records. If media is introduced,
      captions, transcript, pause controls, and reduced motion support are
      required; a waveform alone is never sufficient.
    </p>
  );
}

export default PlatformConfigurationMediaPolicy;
