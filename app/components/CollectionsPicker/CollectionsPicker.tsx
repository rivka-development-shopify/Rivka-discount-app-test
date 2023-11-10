import React, { useState, useEffect, useCallback } from 'react';
import { ResourcePicker } from '@shopify/app-bridge-react';
import { Page, Layout, Card, Text, Button, ResourceList, Avatar, Thumbnail, ResourceItem, LegacyStack, ChoiceList } from '@shopify/polaris';

export function CollectionsPicker(props) {
  const [isOpen, setIsOpen] = useState(false); 

  /* console.log("Props", props) */
  const handleSelection = (selection) => {    
    setIsOpen(false);
    props.onChange(selection)
  };

  const handleOpenPicker = () => {
    setIsOpen(true);
  };

  const handleCancelPicker = () => {
    setIsOpen(false);
  };

  const [selected, setSelected] = useState<string[]>(['hidden']);
  
  const handleChoiceListChange = useCallback((value: string[]) => {
    console.log("Val", value)
    setSelected(value)
  }, []); 

  const renderChildren = useCallback((isSelected: boolean) => {
      if(isSelected) {
        if(selected[1] === 'true') {
          return (
            <Layout.Section>
              <CollectionsPicker {...props.belongToCollectionsT} title="Apply to collections"/>
              <CollectionsPicker {...props.notBelongToCollectionsT} title="Not Apply to collections"/>
            </Layout.Section>
          )
        }
        if(selected[2] === 'false') {
          return (
            <Layout.Section>
              <CollectionsPicker {...props.belongToCollectionsF} title="Apply to collections"/>
              <CollectionsPicker {...props.notBelongToCollectionsF} title="Not Apply to collections"/>
            </Layout.Section>
          )
        }
        return null
      }      
  }, [{...props.belongToCollectionsT}, {...props.belongToCollectionsF}, {...props.notBelongToCollectionsT}, {...props.notBelongToCollectionsF}]);
  console.log('first', props)
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
          props.belongToCollectionsT.value.length >= 1 &&
          
          <ResourceList
            resourceName={{singular: 'collection', plural: 'collections'}}
            items={props.belongToCollectionsT.value}
            showHeader={false}
    
            renderItem={(collection) => {
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
                    <ChoiceList
                      allowMultiple
                      title="TWC SALE Metafield usage"
                      choices={[
                        {
                          label: 'True', 
                          value: 'true',
                          renderChildren,
                        },                                              
                        {
                          label: 'False',
                          value: 'false',
                          renderChildren,
                        },
                      ]}
                      selected={selected}
                      onChange={handleChoiceListChange}
                    />
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
        initialSelectionIds={props.belongToCollectionsT.value} // Set initial selection
        onSelection={(resources) => handleSelection(resources.selection)}
        onCancel={handleCancelPicker}
      />
    </div>
  );
}
