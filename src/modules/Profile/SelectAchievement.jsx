/* eslint-disable react/destructuring-assignment */
import { css } from '@emotion/react'
import React, { useEffect, useState } from 'react'
import Select, { components } from 'react-select'

import Loading from '@/app/loading'
import CheckBox from '@/components/checkbox'
import cn from '@/utils/classes'

const formatGroupLabel = props => (
  <div className='bg-neutral-800'>
    <span>{props.label}</span>
  </div>
)

// Styles for custom option
const customStyles = css`
  .custom-option {
    &.react-select__option--is-selected {
      background-color: transparent !important; // Override default background color
      color: inherit !important; // Inherit text color to ensure readability
    }
    &:hover {
      background-color: transparent !important; // Ensure background stays transparent on hover
    }
    .react-select__menu-list {
      background-color: #281b2e !important;
    }
  }
`

function CustomOption(props) {
  return (
    <components.Option {...props} innerProps={{ ...props.innerProps, className: 'custom-option bg-neutral-800' }}>
      <div className='flex cursor-pointer items-center gap-2 bg-neutral-800 p-2'>
        <CheckBox checked={props.isSelected} />
        <span className='ml-2 text-neutral-300'>{props.data.label}</span>
      </div>
    </components.Option>
  )
}

function CustomValueContainer(props) {
  const { children, hasValue, ...otherProps } = props

  return (
    <components.ValueContainer className={`${hasValue ? 'block!' : ''} truncate!`} {...otherProps}>
      {children}
    </components.ValueContainer>
  )
}

function CustomMultiValue(props) {
  const { children, index } = props
  if (index && index > 0) {
    return `, ${children}`
  }
  return children
}

function SelectAchievement({ data, defaultValue, className, valueSelected = [], onSelected = () => null }) {
  const [selected, setSelected] = useState([...valueSelected])

  // onSelected
  const handleSelected = value => {
    if (value.length <= 4) {
      onSelected(value)
    }
  }

  useEffect(() => {
    setSelected([...valueSelected])
  }, [valueSelected])

  if (!data) {
    return <Loading />
  }
  return (
    <Select
      value={selected}
      defaultValue={defaultValue}
      onChange={handleSelected}
      components={{
        Option: CustomOption,
        MultiValue: CustomMultiValue,
        IndicatorSeparator: () => null,
        ValueContainer: CustomValueContainer,
      }}
      options={data}
      styles={{
        option: provided => ({
          ...provided,
          ...customStyles,
          background: '#281b2e',
        }),
        control: provided => ({
          ...provided,
          background: '#35243D',
          border: 'none',
        }),
        menu: provided => ({
          ...provided,
          background: '#281b2e',
        }),
      }}
      isClearable={false}
      formatGroupLabel={formatGroupLabel}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      isMulti
      isSearchable={false}
      className={cn('rounded-lg bg-neutral-700', className)}
    />
  )
}

export default SelectAchievement
