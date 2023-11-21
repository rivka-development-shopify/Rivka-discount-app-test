import { useEffect, useState } from 'react';
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
  const [selectedCollections, setSelectedCollections] = useState(props.value ?? []);

  useEffect(() => {
    props.onChange(selectedCollections)
  }, [selectedCollections])

  const handleSelection = (rawResoursePickerSelectedCollections) => {
    setIsOpen(false)
    setSelectedCollections(
      oldSelectedCollections => {
        return rawResoursePickerSelectedCollections.map(
          ({ title, id }) => {
            const alreadySelectedCollection = oldSelectedCollections.find(
              collection => collection.id === id
            )

            if(alreadySelectedCollection) {
              return alreadySelectedCollection
            } else {
              return {
                id,
                title,
                useMetafield: false,
                metafiledValue: null
              }
            }
          }
        )
      }
    )
  };

  const handleOpenPicker = () => setIsOpen(true);
  const handleCancelPicker = () => setIsOpen(false);

  const handleUseMetafieldChange = (collectionId) => {
    setSelectedCollections(
      oldSelectedCollections => {
        const newSelectedCollections = [ ...oldSelectedCollections ];

        const changedCollection = newSelectedCollections.find(
          collection => collection.id === collectionId
        )
        if (changedCollection){
          changedCollection.useMetafield = !changedCollection.useMetafield
          changedCollection.metafiledValue = changedCollection.useMetafield ? true : null
        }
        return newSelectedCollections
      }
    )
  };

  const handleRadioChange = (value, collectionId) => {
    setSelectedCollections(
      oldSelectedCollections => {
        const newSelectedCollections = [ ...oldSelectedCollections ];

        const changedCollection = newSelectedCollections.find(
          collection => collection.id === collectionId
        )
        if (changedCollection){
          changedCollection.metafiledValue = value
        }
        return newSelectedCollections
      }
    )
  };


  return  (
    <div>
      <LegacyStack vertical={true}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <Text as="h2" variant="bodyMd">
            {props.title}
          </Text>
          <Button size="micro" onClick={() => {handleOpenPicker()}}>Add Collections</Button>
        </div>

        <ResourceList
          resourceName={{singular: 'collection', plural: 'collections'}}
          items={selectedCollections}
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
                    checked={!!collection.useMetafield}
                    onChange={() => handleUseMetafieldChange(collection.id)}
                  />
                  {
                    !!collection.useMetafield && (
                      <LegacyStack>
                        <RadioButton
                          label="True"
                          checked={collection.metafiledValue}
                          id={`${collection.id}-true`}
                          name={collection.title}
                          onChange={() => handleRadioChange(true, collection.id)}
                        />
                        <RadioButton
                            label="False"
                            checked={!collection.metafiledValue}
                            id={`${collection.id}-false`}
                            name={collection.title}
                            onChange={() => handleRadioChange(false, collection.id)}
                        />
                      </LegacyStack>
                    )
                  }
                </LegacyStack>
              </ResourceItem>
            );
          }}
          emptyState={(
              <></>
            )}
        />
      </LegacyStack>
      <ResourcePicker
        resourceType="Collection"
        open={isOpen}
        initialSelectionIds={selectedCollections.map(collection => ({ id: collection.id }))}
        // initialSelectionIds={[]}
        onSelection={(resources) => handleSelection(resources.selection)}
        onCancel={handleCancelPicker}
      />
    </div>
  );
}
