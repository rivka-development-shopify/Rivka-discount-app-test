import {
  FormLayout,
  Text,
  Button,
  ResourceList,
  ResourceItem,
  LegacyStack,
  Thumbnail,
  Avatar,
  Card
} from '@shopify/polaris';
import { ResourcePicker } from '@shopify/app-bridge-react'

import React, {
  useEffect,
  useState
} from 'react'

function index({
  title,
  onChange,
  value: initialSelectedCollections,
  emptyText
}) {
  const [showPicker, setPickerVisibility] = useState(false);
  const [pickerInitialSelectionIds, setPickerInitialSelectionIds] = useState(initialSelectedCollections);
  const [selectedCollections, setSelectedCollections] = useState(initialSelectedCollections);

  useEffect(()=>{
    onChange(selectedCollections)
  },[selectedCollections])

  const handleOpenPicker = (selected) => {
    setPickerInitialSelectionIds(selected.map(product => ({id: product.shopify_id})));
    setPickerVisibility(true);
  };

  const handlePickerSelection = (selection) => {
    setSelectedCollections((oldState) => {
      return selection.map(collection => {
        const newCollection = {
          shopify_id: collection.id,
          title: collection.title,
        }

        if (collection.image) {
          newCollection.image = {
              originalSrc: collection.image.originalSrc,
              altText: collection.image.altText
          }
        }

        return newCollection
      })
    })
    clearPickerState();
  }

  const clearPickerState = () => {
    setPickerVisibility(false);
    setPickerInitialSelectionIds([]);
  }

  const handleAddCollectionsToApply = () => {
    handleOpenPicker(selectedCollections)
  }

  return (
    <LegacyStack vertical={true}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <Text as="h2" variant="bodyMd">
          {title}
        </Text>

        <Button size="micro" onClick={() => {handleAddCollectionsToApply()}}>Add Collections</Button>
      </div>
      <ResourceList
        resourceName={{singular: 'collection', plural: 'collections'}}
        items={selectedCollections}
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
              </LegacyStack>
            </ResourceItem>
          );
        }}
        emptyState={(
            <Card>
              <Text as="h2" variant="bodyMd">
                {emptyText}
              </Text>
            </Card>
          )}
      />
      <ResourcePicker
        selectMultiple={true}
        open={showPicker}
        resourceType='Collection'
        initialSelectionIds={pickerInitialSelectionIds}
        onSelection={({selection}) => { handlePickerSelection(selection)} }
        onCancel={(e) => {clearPickerState()}}
      />
    </LegacyStack>
  )
}

export default index
