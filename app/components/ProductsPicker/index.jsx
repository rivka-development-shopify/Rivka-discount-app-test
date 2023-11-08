import {
  FormLayout,
  Text,
  Button,
  ResourceList,
  ResourceItem,
  LegacyStack,
  Tag,
  Thumbnail,
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
  value: initialSelectedProducts
}) {
  const [showPicker, setPickerVisibility] = useState(false);
  const [pickerInitialSelectionIds, setPickerInitialSelectionIds] = useState(initialSelectedProducts);
  const [selectedProducts, setSelectedProducts] = useState(initialSelectedProducts);

  useEffect(()=>{
    onChange(selectedProducts)
  },[selectedProducts])

  const handleOpenPicker = (selected) => {
    setPickerInitialSelectionIds(selected.map(product => ({id: product.shopify_id})));
    setPickerVisibility(true);
  };

  const handlePickerSelection = (selection) => {
    setSelectedProducts((oldState) => {
      return selection.map(product => ({
        shopify_id: product.id,
        title: product.title,
        variants: product.variants.map(
            variant => ({
              shopify_id: variant.id,
              displayName: variant.displayName
            })
          ),
        image: product.images.length > 0 ? {
          originalSrc: product.images[0].originalSrc,
          altText: product.images[0].altText
        } : {}
      }))
    })
    clearPickerState();
  }

  const clearPickerState = () => {
    setPickerVisibility(false);
    setPickerInitialSelectionIds([]);
  }

  const handleAddProductsToApply = () => {
    handleOpenPicker(selectedProducts)
  }

  return (
    <LegacyStack vertical={true}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <Text as="h2" variant="bodyMd">
          {title}
        </Text>

        <Button size="micro" onClick={() => {handleAddProductsToApply()}}>Add Products</Button>
      </div>
      <ResourceList
        resourceName={{singular: 'product', plural: 'products'}}
        items={selectedProducts}
        showHeader={false}

        renderItem={(product) => {
          let image = {}
          if (product.image) {
            image = product.image
          } else {
            image = product.images[0]
          }
          const media = <Thumbnail size="small" source={image.originalSrc} alt={image.altText}/>;

          return (
            <ResourceItem
              id={product.id}
              media={media}
            >
              <LegacyStack vertical={true}>
                <Text variant="bodyMd" fontWeight="bold" as="h3">
                  {product.title}
                </Text>
                <Text variant="bodySm">
                  <LegacyStack>
                    {product.variants.map((variant, index) => (
                      <Tag key={`product-variant-${index}`} >
                        <Text variant="bodySm"> {variant.displayName} </Text>
                      </Tag>
                    ))}
                  </LegacyStack>
                </Text>
              </LegacyStack>
            </ResourceItem>
          );
        }}
        emptyState={(
            <Card>
              <Text as="h2" variant="bodyMd">
                No products to apply discount added yet.
              </Text>
            </Card>
          )}
      />
      <ResourcePicker
        selectMultiple={true}
        open={showPicker}
        showVariants={true}
        resourceType='Product'
        initialSelectionIds={pickerInitialSelectionIds}
        onSelection={({selection}) => { handlePickerSelection(selection)} }
        onCancel={(e) => {clearPickerState()}}
      />
    </LegacyStack>
  )
}

export default index
