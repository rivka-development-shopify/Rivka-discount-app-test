import { Checkbox } from "@shopify/polaris";

export default function CustomCheckbox (props) {
    return <Checkbox
      label="TWC SALE metafield value is true"
      checked={props.value}
      onChange={props.onChange}
    />
}