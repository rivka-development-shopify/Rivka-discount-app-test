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
  FooterHelp
} from "@shopify/polaris";


import { authenticate } from "../shopify.server";

import {
  updateDiscountCode,
  getDiscountCodeById
} from '../controllers/discountCodesControllers';

import { parseFormDataToJson } from '../utils/formatData';
import shopify from "../shopify.server";

import DiscountSelector from "~/components/DiscountSelector";

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


  useEffect(() => {
    if(actionData != null) {
      setDiscountCode(actionData.discountCode.code);
      setSelectedDiscount(actionData.discountCode.stackDiscounts)
    }
  },
  [actionData])

  useEffect(() => {
    if(loaderDiscount != null) {
      setDiscountCode(loaderDiscount.code);
      setSelectedDiscount(loaderDiscount.stackDiscounts)
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
    console.log({
      discountCodeId,
      discountCode,
      stackDiscounts: selectedDiscounts
    })
  }

  const handleFormSubmit = () => {
    submit({
      discount: JSON.stringify({
        discountCodeId,
        discountCode,
        stackDiscounts: selectedDiscounts
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
          </FormLayout>
        </LegacyCard>
      </div>
      <FooterHelp></FooterHelp>
    </Page>
  );
}



