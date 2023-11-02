import {
  Banner,
  useApi,
  useTranslate,
  reactExtension,
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'purchase.checkout.reductions.render-after',
  () => <Extension />,
);

function Extension() {
  const translate = useTranslate();
  const { extension } = useApi();

  return (
    <Banner title="ui error msgs">
      {translate('welcome', {target: extension.target})}
    </Banner>
  );
}