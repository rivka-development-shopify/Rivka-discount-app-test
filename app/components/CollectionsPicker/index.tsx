import { useState } from 'react';
import { ResourcePicker } from '@shopify/app-bridge-react';
import { 
  Card, 
  Text, 
  Button, 
  ResourceList, 
  Avatar, Thumbnail, 
  ResourceItem, 
  LegacyStack, 
  RadioButton, 
  Checkbox 
} from '@shopify/polaris';

export default function CollectionsPicker (props) {
  const [isOpen, setIsOpen] = useState(false);  
  const [selection, setSelection] = useState(props.value);   

  const handleSelection = (modalSelection) => {
       
    const currentSelectionObject = selection.reduce((collections, collection) => {
        return {
            ...collections,
            [collection.id]: collection
        }
    }, {})


    const selectionResult =  modalSelection.filter((collection) => {
        return !currentSelectionObject[collection.id]
    }).concat(selection);  
    setSelection(selectionResult);
    setIsOpen(false);
    props.onChange(selectionResult);    
  };

  const handleOpenPicker = () => setIsOpen(true);
  const handleCancelPicker = () => setIsOpen(false);   
  
  const handleCheckboxChange = (index) => { 
    if(!selection[index]) return 
    setSelection(prevSelection => {
      prevSelection[index].checkedState = !prevSelection[index].checkedState;
      return prevSelection
    })
    props.onChange(selection)     
  };
  const handleRadioChange = (value, index) => { 
    if(!selection[index]) return 
    console.log({value})    
    setSelection(prevSelection => {
      prevSelection[index].radioState = value;
      return prevSelection
    })
    props.onChange(selection)    
  }; 
  console.log({title: props.title, props, selection})  
  
  return  (
    <div>
      <LegacyStack vertical={true}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <Text as="h2" variant="bodyMd">
            {props.title}
          </Text>

          <Button size="micro" onClick={() => {handleOpenPicker()}}>Add Collections</Button>
        </div>
        {
          props.value.length >= 1 &&
          
          <ResourceList
            resourceName={{singular: 'collection', plural: 'collections'}}
            items={props.value}
            showHeader={false}
    
            renderItem={(collection, id ,index) => {
              const titleSplit = collection.title.split(' ')
              let initials = ''
              if(titleSplit.length > 1) {
                initials = collection.title.split(' ').slice(0,2).map(string => string.charAt(0)).join('').toString()
              } else {
                initials = collection.title.charAt(0) + collection.title.charAt(1)
              }
              initials = initials.toUpperCase()
    
              let media = <Avatar shape='square' size='small' initials={initials} name={collection.title} />;
              if(collection.image) {
                media = <Thumbnail size="small" source={collection.image.originalSrc} alt={collection.image.altText}/>;
              }
    
              return (
                <ResourceItem
                  id={collection.id}
                  media={media}
                >
                  <LegacyStack vertical={true} alignment='baseline'>
                    <Text variant="bodyMd" fontWeight="bold" as="h3">
                      {collection.title}
                    </Text>                    
                    <Checkbox
                      label="TWC SALE Metafield usage"
                      checked={!!collection.checkedState}
                      onChange={() => handleCheckboxChange(index)}                      
                    />
                    {  
                      !!collection.checkedState && (
                        <LegacyStack>
                          <RadioButton          
                            label="True"
                            checked={!!collection.radioState}
                            id={`${collection.id}-true`}
                            name={collection.title}         
                            onChange={() => handleRadioChange(true, index)}
                          />
                          <RadioButton          
                              label="False"
                              checked={collection.radioState === false}
                              id={`${collection.id}-false`}
                              name={collection.title}         
                              onChange={() => handleRadioChange(false, index)}
                          />                        
                        </LegacyStack>
                      )                    
                    }
                  </LegacyStack>
                </ResourceItem>
              );
            }}
            emptyState={(
                <Card>
                  <Text as="h2" variant="bodyMd">
                    EMPTY
                  </Text>
                </Card>
              )}
          />        
        }
      </LegacyStack>
      <ResourcePicker
        resourceType="Collection"
        open={isOpen}
        initialSelectionIds={selection} // Set initial selection
        onSelection={(resources) => handleSelection(resources.selection)}
        onCancel={handleCancelPicker}
      />
    </div>
  );
}
