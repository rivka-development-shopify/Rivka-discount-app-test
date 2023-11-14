import React, { useState, useCallback } from 'react';
import { ResourcePicker } from '@shopify/app-bridge-react';
import { ChoiceList, Layout, Card, Text, Button, ResourceList, Avatar, Thumbnail, ResourceItem, LegacyStack } from '@shopify/polaris';

export function CollectionsPicker(props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(['none']);
  const [metafiledSelected, setMetafiledSelected] = useState(['hidden']);
  console.log(props)
  const handleSelection = (selection) => {
    console.log(selection)
    setIsOpen(false);
    props.onChange(selection)
  };

  const handleOpenPicker = () => {
    setIsOpen(true);
  };

  const handleCancelPicker = () => {
    setIsOpen(false);
  };

  const renderChildren = useCallback(
    (isSelected) =>
      isSelected && (
        <ChoiceList
          titleHidden={true}
          allowMultiple
          choices={[
            {
              label: 'True',
              value: 'true',
            },
            {
              label: 'False',
              value: 'false',
            },
            {
              label: 'Unset',
              value: 'null',
            },
          ]}
          selected={metafiledSelected}
          onChange={(value) => setMetafiledSelected(value)}
        />
      ),
    [setMetafiledSelected, metafiledSelected],
  );

  return (
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
                >
                  <LegacyStack vertical={false} alignment='center'>
                    {media}
                    <Text variant="bodyMd" fontWeight="bold" as="h3">
                      {collection.title}
                    </Text>
                    <ChoiceList
                        titleHidden={true}
                        allowMultiple
                        choices={[
                          {
                            label: 'Use Metafield',
                            value: 'true',
                            renderChildren,
                          },
                        ]}
                        selected={selected}
                        onChange={(value) => setSelected(value)}
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
        initialSelectionIds={props.value} // Set initial selection
        onSelection={(resources) => handleSelection(resources.selection)}
        onCancel={handleCancelPicker}
      />
    </div>
  );
}
