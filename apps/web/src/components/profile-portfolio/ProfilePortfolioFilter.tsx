import * as React from 'react';

export type ProfilePortfolioFilterProps = Readonly<{
  canEdit: boolean;
  filter: string;
  onFilterSubmit: (value: string) => void;
}>;

const ProfilePortfolioFilter = ({
  canEdit,
  filter,
  onFilterSubmit,
}: ProfilePortfolioFilterProps): React.ReactElement => {
  const filterRef = React.useRef<HTMLInputElement>(null);
  if (canEdit) {
    return (
      <div role="search">
        <label htmlFor="profile-portfolio-filter">Filter profile facts</label>
        <input
          ref={filterRef}
          id="profile-portfolio-filter"
          name="filter"
          type="search"
          defaultValue={filter}
        />
        <button
          type="button"
          onClick={() => onFilterSubmit(filterRef.current?.value ?? '')}
        >
          Apply filter
        </button>
      </div>
    );
  }
  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get('filter');
        onFilterSubmit(typeof value === 'string' ? value : '');
      }}
    >
      <label htmlFor="profile-portfolio-filter">Filter profile facts</label>
      <input
        id="profile-portfolio-filter"
        name="filter"
        type="search"
        defaultValue={filter}
      />
      <button type="submit">Apply filter</button>
    </form>
  );
};

export default ProfilePortfolioFilter;
