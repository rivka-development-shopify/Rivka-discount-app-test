import {
  InlineLayout,
  Text,
  Icon,  
  useApi,
  useTranslate,
  reactExtension,
  BlockStack,
} from '@shopify/ui-extensions-react/checkout';


export default reactExtension(
  'purchase.checkout.shipping-option-list.render-before', 
  () => <Extension />,
);

function Extension() {
  const translate = useTranslate();
  const { extension, lines } = useApi();

  // Create a new Date object
  const currentDate = new Date();

  const timeOptions = {
    timeZone: 'America/New_York',
    weekday: 'long',
    hour: 'numeric',
    hour12: false
  };

  const estDateTimeString = currentDate.toLocaleString('en-US', timeOptions);

  // Extract the day and hour from the EST date and time string
  const estDay = estDateTimeString.split(',')[0];
  const estHour = parseInt(estDateTimeString.split(' ')[1]);
    
  const esteticaIncluded = lines.current?.some(item => item.merchandise.product.vendor == "Snowboard Vendor");
  const regProdIncluded = lines.current?.some(item => item.merchandise.product.vendor != "Snowboard Vendor");
  
  
  if(esteticaIncluded && regProdIncluded) {
    if ((estDay === 'Monday' || estDay === 'Tuesday' || estDay === 'Wednesday' || estDay === 'Thursday' || estDay === 'Friday') && estHour < 14) {
      return (
        <BlockStack>
          <InlineLayout columns={['5%', '30%', 'fill']}>
            <Icon source="truck" size='large'/>
            <Text size="large" emphasis='italic'>Your Estetica order will </Text>
            <Text size="large" emphasis='bold' appearance='success'>Ship In 7-10 Days!</Text>
          </InlineLayout>
          <InlineLayout columns={['5%', '20%', 'fill']}>
            <Icon source="truck" size='large'/>
            <Text size="large" emphasis='italic'>Your order will </Text>
            <Text size="large" emphasis='bold' appearance='success'>Ship today!</Text>
          </InlineLayout> 
        </BlockStack>   
      );
    } else if ((estDay === 'Monday' || estDay === 'Tuesday' || estDay === 'Wednesday' || estDay === 'Thursday') && estHour >= 14) {
      return (
        <BlockStack>
          <InlineLayout columns={['5%', '30%', 'fill']}>
            <Icon source="truck" size='large'/>
            <Text size="large" emphasis='italic'>Your Estetica order will </Text>
            <Text size="large" emphasis='bold' appearance='success'>Ship In 7-10 Days!</Text>
          </InlineLayout>
          <InlineLayout columns={['5%', '20%', 'fill']}>
            <Icon source="truck" size='large'/>
            <Text size="large" emphasis='italic'>Your order will </Text>
            <Text size="large" emphasis='bold' appearance='success'>Ship tomorrow!</Text>
          </InlineLayout> 
        </BlockStack>      
      );
    } else if ((estDay === 'Friday' && estHour >= 14) || (estDay === 'Saturday' || estDay === 'Sunday')) {
      return (
        <BlockStack>
          <InlineLayout columns={['5%', '30%', 'fill']}>
            <Icon source="truck" size='large'/>
            <Text size="large" emphasis='italic'>Your Estetica order will </Text>
            <Text size="large" emphasis='bold' appearance='success'>Ship In 7-10 Days!</Text>
          </InlineLayout>
          <InlineLayout columns={['5%', '20%', 'fill']}>
            <Icon source="truck" size='large'/>
            <Text size="large" emphasis='italic'>Your order will </Text>
            <Text size="large" emphasis='bold' appearance='success'>Ship in 1-3 days!</Text>
          </InlineLayout> 
        </BlockStack>      
      );
    }    
  } else if(esteticaIncluded) {
    return (      
        <InlineLayout columns={['5%', '30%', 'fill']}>
          <Icon source="truck" size='large'/>
          <Text size="large" emphasis='italic'>Your Estetica order will </Text>
          <Text size="large" emphasis='bold' appearance='success'>Ship In 7-10 Days!</Text>
        </InlineLayout>    
    );
  } else if(regProdIncluded) {
    if ((estDay === 'Monday' || estDay === 'Tuesday' || estDay === 'Wednesday' || estDay === 'Thursday' || estDay === 'Friday') && estHour < 14) {
      return (
        <InlineLayout columns={['5%', '20%', 'fill']}>
          <Icon source="truck" size='large'/>
          <Text size="large" emphasis='italic'>Your order will </Text>
          <Text size="large" emphasis='bold' appearance='success'>Ship today!</Text>
        </InlineLayout>     
      );
    } else if ((estDay === 'Monday' || estDay === 'Tuesday' || estDay === 'Wednesday' || estDay === 'Thursday') && estHour >= 14) {
      return (
        <InlineLayout columns={['5%', '20%', 'fill']}>
          <Icon source="truck" size='large'/>
          <Text size="large" emphasis='italic'>Your order will </Text>
          <Text size="large" emphasis='bold' appearance='success'>Ship tomorrow!</Text>
        </InlineLayout>      
      );
    } else if ((estDay === 'Friday' && estHour >= 14) || (estDay === 'Saturday' || estDay === 'Sunday')) {
      return (
        <InlineLayout columns={['5%', '20%', 'fill']}>
          <Icon source="truck" size='large'/>
          <Text size="large" emphasis='italic'>Your order will </Text>
          <Text size="large" emphasis='bold' appearance='success'>Ship in 1-3 days!</Text>
        </InlineLayout>      
      );
    } 
  }
}





