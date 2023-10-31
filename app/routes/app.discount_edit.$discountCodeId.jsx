import { useEffect, useState, useCallback } from "react";
import { json } from "@remix-run/node";

import {
  useSubmit,
  useActionData,
  useLoaderData
} from "@remix-run/react";



import {
  Page,
  LegacyCard,
  ChoiceList,
  TextField,
  FormLayout,
  InlineError,
  FooterHelp,
  Divider
} from "@shopify/polaris";


import { authenticate } from "../shopify.server";

import {
  updateDiscountCode,
  getDiscountCodeById
} from '../controllers/discountCodesControllers';

import { parseFormDataToJson } from '../utils/formatData';
import shopify from "../shopify.server";

import DiscountSelector from "~/components/DiscountSelector";
import ProductPicker from "~/components/ProductsPicker";
import CollectionsPicker from "~/components/CollectionsPicker";

// this is the method "get"
export const loader = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const { admin } = await shopify.authenticate.admin(request);
  const discountCode = await getDiscountCodeById(params.discountCodeId);

  const response = await admin.graphql(
    `#graphql
      query {
        discountNodes(first: 100) {
          edges {
            node {
              id
              discount {
                ... on DiscountCodeBasic {
                  title
                  status
                  codes(first: 5) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                }
                ... on DiscountCodeBxgy {
                  title
                  status
                  codes(first: 5) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                }
                ... on DiscountCodeFreeShipping {
                  title
                  status
                  codes(first: 5) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
  );

  const rawShopifyCurrentDiscounts = await response.json();

  const shopifyCurrentDiscounts = rawShopifyCurrentDiscounts.data.discountNodes.edges.map(
    edge => {
      return {
        id: edge.node.id,
        title: edge.node.discount?.title || '',
        status: edge.node.discount?.status || 'EXPIRED',
        codes: edge.node.discount?.codes?.edges.map(edge => edge.node?.code || '') || []
      }
    }
  ).filter(discount => discount.status !== 'EXPIRED');

  return json({ shop: session.shop.replace(".myshopify.com", ""), discountCode, shopifyCurrentDiscounts, discountCodeId: params.discountCodeId });
};


// every time the submit fuction runs ends up here
export async function action({ request  }) {
  try {
    // easier to work with JSON better then to work with FormData object
    const body = parseFormDataToJson(await request.formData())
    const discount = await JSON.parse(body.discount)
    switch(request.method) {
      case 'PUT':
        updateDiscountCode(discount)
        break;
    }

    return { discountCode: await getDiscountCodeById() };
  } catch (e) {
    console.error({ msg: "Error on remix landing page action", err: e})
    return null
  }
}

export default function Index() {
  const submit = useSubmit();
  const actionData = useActionData();
  const { discountCode: loaderDiscount, shopifyCurrentDiscounts, discountCodeId } = useLoaderData();
  const [formModified, setFormModified] = useState(false)

  const [discountCode, setDiscountCode] = useState(loaderDiscount != null? loaderDiscount.code : '')
  const [selectedDiscounts, setSelectedDiscount] = useState(loaderDiscount != null? loaderDiscount.stackDiscounts : [])
  const [productsToApply, setProductsToApply] = useState(loaderDiscount != null? loaderDiscount.productsToApply : [])
  const [productsToIgnore, setProductsToIgnore] = useState(loaderDiscount != null? loaderDiscount.productsToIgnore : [])
  const [collectionsToApply, setCollectionsToApply] = useState(loaderDiscount != null? loaderDiscount.collectionsToApply : [])
  const [collectionsToIgnore, setCollectionsToIgnore] = useState(loaderDiscount != null? loaderDiscount.collectionsToIgnore : [])


  useEffect(() => {
    if(actionData != null) {
      setDiscountCode(actionData.discountCode.code);
      setProductsToApply(actionData.discountCode.productsToApply)
      setProductsToIgnore(actionData.discountCode.productsToIgnore)
      setSelectedDiscount(actionData.discountCode.stackDiscounts)
      setCollectionsToApply(actionData.discountCode.collectionsToApply)
      setCollectionsToIgnore(actionData.discountCode.collectionsToIgnore)
    }
  },
  [actionData])

  useEffect(() => {
    if(loaderDiscount != null) {
      setDiscountCode(loaderDiscount.code);
      setProductsToApply(loaderDiscount.productsToApply)
      setProductsToIgnore(loaderDiscount.productsToIgnore)
      setSelectedDiscount(loaderDiscount.stackDiscounts)
      setCollectionsToApply(loaderDiscount.collectionsToApply)
      setCollectionsToIgnore(loaderDiscount.collectionsToIgnore)
    }
  },
  [loaderDiscount])




  const handleDiscountCodeChange = (value) => {
    setFormModified(true);
    setDiscountCode(value);
  }

  const handleDiscountSelectorChange = (value) => {
    setFormModified(true)
    setSelectedDiscount(value)
  }


  const handleTestButton = () => {
    console.log(collectionsToApply)
  }

  const handleAddProductsToApply = (value) => {
    setProductsToApply(value)
  };

  const handleAddProductsToIgnore = (value) => {
    setProductsToIgnore(value)
  }

  const handleAddCollectionsToIgnore = (value) => {
    setCollectionsToIgnore(value)
  }
  const handleAddCollectionsToApply = (value) => {
    setCollectionsToApply(value)
  }

  const handleFormSubmit = () => {
    submit({
      discount: JSON.stringify({
        discountCodeId,
        discountCode,
        stackDiscounts: selectedDiscounts,
        productsToApply,
        collectionsToApply,
        productsToIgnore,
        collectionsToIgnore
      })
    }, {method: 'PUT'})
  }
  return (
    <Page
      divider={false}
      fullWidth={false}
      primaryAction={{content: "Save Changes", onAction: () => {handleFormSubmit()}, disabled: !formModified  }}
    >
      {/* //ADD A SHOPIFY POLARIS SAVE BAR EVERYTIME discountCodeS STATE IS DIFFERENT FROM ORIGINAL discountCodeS */}
      <div className="discount-form">
        <LegacyCard title="Edit your custom discount code" sectioned>
          <FormLayout>
            {
              loaderDiscount == null &&
                <InlineError message="There's no Custom Discount Code with this ID" fieldID={""}/>
            }

            <TextField
              label="Discount Code"
              value={discountCode}
              onChange={handleDiscountCodeChange}
              autoComplete="off"
              disabled={loaderDiscount == null}
            />

            <DiscountSelector
              options={shopifyCurrentDiscounts ? shopifyCurrentDiscounts : []}
              value={selectedDiscounts}
              onChange={(newValue) => { handleDiscountSelectorChange(newValue)}}
            />


            <Divider />

            <ProductPicker
              title="Products to apply discount"
              value={productsToApply}
              onChange={(newValue) => { handleAddProductsToApply(newValue)}}
            />
            <CollectionsPicker
              title="Collections to apply the discount"
              emptyText="No collections to apply discount added yet."
              value={collectionsToApply}
              onChange={(newValue) => { handleAddCollectionsToApply(newValue)}}
            />

            <Divider />

            <ProductPicker
              title="Products to ignore the discount"
              value={productsToIgnore}
              onChange={(newValue) => { handleAddProductsToIgnore(newValue)}}
            />

            <CollectionsPicker
              title="Collections to ignore the discount"
              emptyText="No collections to ignore discount added yet."
              value={collectionsToIgnore}
              onChange={(newValue) => { handleAddCollectionsToIgnore(newValue)}}
            />
          </FormLayout>
        </LegacyCard>
      </div>
      <FooterHelp></FooterHelp>
    </Page>
  );
}



