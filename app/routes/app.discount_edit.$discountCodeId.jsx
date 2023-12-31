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
  Banner,
  Layout,
  LegacyStack
} from "@shopify/polaris";


import { authenticate } from "../shopify.server";

import {
  updateDiscountCode,
  getDiscountCodeById
} from '../controllers/discountCodesControllers';

import { parseFormDataToJson } from '../utils/formatData';
import shopify from "../shopify.server";

import DiscountSelector from "~/components/DiscountSelector";
import { getDiscounts } from "~/services/shopifyAdmin";

// this is the method "get"
export const loader = async ({ request, params }) => {
  try {
    const { session } = await authenticate.admin(request);
    const discountCode = await getDiscountCodeById(params.discountCodeId);
    const rawShopifyCurrentDiscounts = await getDiscounts(request);
    const shopifyCurrentDiscounts = rawShopifyCurrentDiscounts.map(
      ({node}) => ({
        id: node.id,
        type: node.discount.__typename,
        title: node.discount?.title ?? '',
        status: node.discount?.status ?? 'EXPIRED',
        codes: node.discount?.codes?.edges.map(edge => edge.node?.code ?? '') ?? [],
        creatorOrEditor: node.events.edges.length > 0 ? node.events.edges[0].node.appTitle : null
      })
    )
    .filter(discount => !discount.type.includes('Automatic'))
    .filter(discount => discount.status !== 'EXPIRED')
    .filter(discount => (
      !(
        (
          discount.creatorOrEditor.includes("DiscountYard — Stack Discounts") ||
          discount.creatorOrEditor.includes("Custom Discounts")
        ) && discount.type === 'DiscountCodeBasic'
      )
    ));

    return json({ shop: session.shop.replace(".myshopify.com", ""), discountCode, shopifyCurrentDiscounts, discountCodeId: params.discountCodeId });
  } catch(e) {
    console.log(e)
    return json({ error: 'Unable to retrieve stack discount', e});
  }
};


// every time the submit fuction runs ends up here
export async function action({ request, params }) {
  try {
    // easier to work with JSON better then to work with FormData object
    const body = parseFormDataToJson(await request.formData())
    const discount = await JSON.parse(body.discount)
    switch(request.method) {
      case 'PUT':
        await updateDiscountCode(discount)
        break;
    }

    return { discountCode: await getDiscountCodeById(params.discountCodeId) };
  } catch (e) {
    console.error({ msg: "Error on remix landing page action", err: e})
    return { discountCode: await getDiscountCodeById(), error: 'Unable to update stack discount' }
  }
}

export default function Index() {
  const submit = useSubmit();
  const actionData = useActionData();
  const { discountCode: loaderDiscount, shopifyCurrentDiscounts, discountCodeId, error: loadErrorMessage } = useLoaderData();
  const [formModified, setFormModified] = useState(false)
  const loadError = loadErrorMessage ?? null;
  const submitError = actionData?.error ?? null;
  const [error, setError] = useState('')
  const [discountCode, setDiscountCode] = useState(loaderDiscount != null? loaderDiscount.code : '')
  const [selectedDiscounts, setSelectedDiscount] = useState(loaderDiscount != null? loaderDiscount.stackDiscounts : [])


  useEffect(() => {
    if(actionData != null) {
      setDiscountCode(actionData.discountCode.code);
      setSelectedDiscount(actionData.discountCode.stackDiscounts)
      setFormModified(false)
      setError('')
    }
  },
  [actionData])

  useEffect(() => {
    if(loaderDiscount != null) {
      setDiscountCode(loaderDiscount.code);
      setSelectedDiscount(loaderDiscount.stackDiscounts)
      setFormModified(false)
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

  const handleFormSubmit = () => {
    submit({
      discount: JSON.stringify({
        discountCodeId,
        discountCode,
        stackDiscounts: selectedDiscounts
      })
    }, {method: 'PUT'})
  }

  const handleTest = () => {
    console.log(shopifyCurrentDiscounts)
  }

  const errorBanner =
    (submitError || loadError || error !== '') ? (
      <Layout.Section>
        <Banner status="critical">
          <p>There were some issues with your form:</p>
          <ul>
            {submitError && <li>{submitError}</li>}
            {loadError && <li>{loadError}</li>}
            {error && <li>{error}</li>}
          </ul>
        </Banner>
      </Layout.Section>
    ) : null;

  return (
    <Page
      divider={false}
      fullWidth={false}
      primaryAction={{content: "Save Changes", onAction: () => {handleFormSubmit()}, disabled: !formModified  }}
      backAction={{content: 'Stack Discounts', url: '../'}}
      // secondaryActions={[{content: "TESTE", onAction: () => {handleTest()}}]}
    >
      {/* //ADD A SHOPIFY POLARIS SAVE BAR EVERYTIME discountCodeS STATE IS DIFFERENT FROM ORIGINAL discountCodeS */}
      <Layout sectioned>
        {errorBanner}
        <Layout.Section>
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
                  setError={setError}
                />
              </FormLayout>
            </LegacyCard>
          </div>
          <FooterHelp></FooterHelp>
        </Layout.Section>
      </Layout>
    </Page>
  );
}



