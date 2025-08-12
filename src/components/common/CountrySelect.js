import React, { useMemo } from 'react';
import Select from 'react-select';
import countries from 'world-countries';

function flagEmoji(code) {
  return code
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));
}

const baseOptions = countries.map(c => ({
  value: c.name.common,             // "Ethiopia"
  code: c.cca2,                      // "ET"
  label: `${flagEmoji(c.cca2)}  ${c.name.common} (${c.cca2})`,
}));

export default function CountrySelect({
  value,              // { value, code } or string
  onChange,           // (opt) => void
  placeholder = 'Select a country…',
  isClearable = true,
  className,
  menuPlacement = 'auto',
}) {
  const options = useMemo(() => baseOptions, []);

  // normalize incoming value
  const selected =
    typeof value === 'string'
      ? options.find(o => o.value.toLowerCase() === value.toLowerCase())
      : value && value.value
        ? options.find(o => o.value === value.value)
        : null;

  return (
    <Select
      options={options}
      value={selected || null}
      onChange={(opt) => onChange?.(opt || null)}
      placeholder={placeholder}
      isClearable={isClearable}
      className={className}
      menuPlacement={menuPlacement}
      styles={{
        control: (base) => ({
          ...base,
          borderRadius: 10,
          minHeight: 42,
          borderColor: '#cbd5e1',
          boxShadow: 'none',
          ':hover': { borderColor: '#94a3b8' },
        }),
      }}
    />
  );
}
