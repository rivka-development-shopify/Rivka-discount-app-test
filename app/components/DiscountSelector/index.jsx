import {
  Icon,
  Combobox,
  Text,
  LegacyStack,
  Tag,
  Listbox,
  FormLayout,
  Banner,
  Badge
} from '@shopify/polaris'

import {SearchMinor} from '@shopify/polaris-icons';

import React, {
  useCallback,
  useEffect,
  useState
} from 'react'

function DiscountSelector({
    options: discountOptions,
    value: selectedDiscounts,
    onChange,
    setError
  }) {

  const [stackDiscountInputValue, setStackDiscountInputValue] = useState('');
  const [selectedStackDiscounts, setSelectedStackDiscounts] = useState(selectedDiscounts);
  const [stackDiscountOptions, setStackDiscountOptions] = useState(discountOptions)

  useEffect(()=>{
    onChange(selectedStackDiscounts)
  }, [selectedStackDiscounts])

  const updateStakDiscountInput = useCallback(
    (value) => {
      setStackDiscountInputValue(value);

      if (value === '') {
        setStackDiscountOptions(discountOptions);
        return;
      }

      const filterRegex = new RegExp(value, 'i');
      const resultOptions = discountOptions.filter((option) =>
        option.title.match(filterRegex),
      );
      setStackDiscountOptions(resultOptions);
    },
    [discountOptions],
  );

  const updateDiscountSelection = useCallback(
    (selected) => {
      if (selectedStackDiscounts.includes(selected)) {
        setSelectedStackDiscounts(
          selectedStackDiscounts.filter((option) => option !== selected),
        );
      } else {
        setSelectedStackDiscounts([...selectedStackDiscounts, selected]);
      }

      updateStakDiscountInput('');
    },
    [selectedStackDiscounts, updateStakDiscountInput],
  );

  const discountOptionsMarkup =
  stackDiscountOptions.length > 0
      ? stackDiscountOptions.map((discount) => {
          const {title: label, id: value} = discount;

          return (
            <Listbox.Option
              key={`${value}`}
              value={value}
              selected={selectedStackDiscounts.includes(value)}
              accessibilityLabel={label}
            >
              {label}
            </Listbox.Option>
          );
        })
      : null;

  const removeTag = useCallback(
    (tag) => () => {
      const discounts = [...selectedStackDiscounts];
      discounts.splice(discounts.indexOf(tag), 1);
      setSelectedStackDiscounts(discounts);
    },
    [selectedStackDiscounts],
  );

  const tagsMarkup = selectedStackDiscounts.map((discount) => {
    const discountTitle = discountOptions.find(shopifyDiscount => shopifyDiscount.id === discount)?.title ?? null
    if(discountTitle) {
      return (
        <Tag key={`discount-${discount}`} onRemove={removeTag(discount)}>
          {discountTitle}
        </Tag>
      )
    }
    else {
      setError('One or more of selected disocunts does not exists anymore')
      return (
        <Tag key={`discount-${discount}`} onRemove={removeTag(discount)}>
          {discount.replace('gid://shopify/DiscountCodeNode/', '!! Discount ID: ')}
        </Tag>
      )
    }
  });

  return (
    <FormLayout>
      <Combobox
        allowMultiple
        activator={
          <Combobox.TextField
            prefix={<Icon source={SearchMinor} />}
            onChange={updateStakDiscountInput}
            label="Stack Discount Codes"
            value={stackDiscountInputValue}
            placeholder="Search Discount Code"
            autoComplete="off"
          />
        }
      >
        {discountOptionsMarkup? (
          <Listbox onSelect={updateDiscountSelection}>
            {discountOptionsMarkup}
          </Listbox>
        ) : null}
      </Combobox>

      <Text>
        <LegacyStack>{tagsMarkup}</LegacyStack>
      </Text>
    </FormLayout>
  )
}

export default DiscountSelector
