import React from 'react';
import { Select } from 'antd';

export interface OptionType {
  label: string;
  value: string | number;
}

interface CustomDropdownProps {
  options: OptionType[];
  defaultValue?: OptionType;
  value?: string | number;
  className?: string;
  placeholder?: string;
  modal?: boolean;
  onChange?: (option: OptionType | null) => void;
}

const CustomSelect: React.FC<CustomDropdownProps> = ({
  options = [],
  defaultValue,
  value,
  className,
  placeholder,
  modal,
  onChange,
}) => {
  // Determine the popup container based on the `modal` prop
  const getPopupContainer = modal
    ? () =>
        (document.getElementsByClassName('modal')[0] as HTMLElement) ||
        document.body
    : () => document.body;

  // Handle value change
  const handleChange = (selectedValue: any) => {
    if (onChange) {
      const selectedOption = options.find(opt => opt.value === selectedValue);
      onChange(selectedOption || null);
    }
  };

  // Ensure options is an array
  const safeOptions = Array.isArray(options) ? options : [];

  // Convert to Ant Design's expected options format
  const selectOptions = safeOptions.map((option) => ({
    label: option.label,
    value: option.value,
  }));

  return (
    <Select
      defaultValue={defaultValue?.value}
      value={value || undefined}
      className={className}
      placeholder={placeholder || 'Select'}
      style={{ width: '100%', minHeight: '40px' }}
      popupMatchSelectWidth={true}
      getPopupContainer={getPopupContainer}
      onChange={handleChange}
      showSearch
      allowClear
      optionFilterProp="label"
      filterOption={(input, option) =>
        (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
      }
      options={selectOptions}
      notFoundContent="No options available"
    />
  );
};

export default CustomSelect;
