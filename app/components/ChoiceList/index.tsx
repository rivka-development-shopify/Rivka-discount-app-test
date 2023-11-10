import {ChoiceList} from '@shopify/polaris';
import {useState, useCallback} from 'react';
import { CollectionsPicker } from '../CollectionsPicker';

export default function CustomChoiceList (props) {
  const [selected, setSelected] = useState<string[]>(['none']);
  
  const handleChoiceListChange = useCallback(
    (value: string[]) => setSelected(value),
    [],
  ); 

  const renderChildren = useCallback(
    (isSelected: boolean) =>
      isSelected && (
        <CollectionsPicker {...props.belongToCollections} title="Apply to collections"/>
      ),
    [handleTextFieldChange, textFieldValue],
  );
  console.log(props)
  return (
    <div style={{height: '150px'}}>
      <ChoiceList
        title="Discount minimum requirements"
        choices={[
          {label: 'None', value: 'none'},
          {label: 'Minimum purchase', value: 'minimum_purchase'},
          {
            label: 'Minimum quantity',
            value: 'minimum_quantity',
            renderChildren,
          },
        ]}
        selected={selected}
        onChange={handleChoiceListChange}
      />
    </div>
  );
}