import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      const { id } = routeParams;

      try {
        const foodResponse = await api.get(`foods/${id}`);

        const foodFromApi = foodResponse.data as Food;

        const foodExtas = foodFromApi.extras.map(item => ({
          ...item,
          quantity: 0,
        }));

        setFood({
          ...foodFromApi,
          formattedPrice: formatValue(foodFromApi.price),
        });

        setExtras(foodExtas);
      } catch (err) {
        console.log(err);
      }
    }

    loadFood();
  }, [routeParams]);

  useEffect(() => {
    const checkFavorite = async (): Promise<void> => {
      try {
        const favoriteResponse = await api.get('favorites');

        const favoriteArr = favoriteResponse.data.filter(
          (item: Food) => item.id === food.id,
        );

        setIsFavorite(favoriteArr.length > 0);
      } catch (err) {
        console.log(err);
      }
    };

    checkFavorite();
  }, [food]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    const extraIndex = extras.findIndex(item => item.id === id);

    setExtras(oldState => {
      const increasedQuantity = oldState[extraIndex].quantity + 1;

      const newExtra = {
        ...oldState[extraIndex],
        quantity: increasedQuantity,
      };

      return [
        ...oldState.slice(0, extraIndex),
        newExtra,
        ...oldState.slice(extraIndex + 1, oldState.length),
      ];
    });
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const extraIndex = extras.findIndex(item => item.id === id);

    if (extras[extraIndex].quantity > 0) {
      setExtras(oldState => {
        const increasedQuantity = oldState[extraIndex].quantity - 1;

        const newExtra = {
          ...oldState[extraIndex],
          quantity: increasedQuantity,
        };

        return [
          ...oldState.slice(0, extraIndex),
          newExtra,
          ...oldState.slice(extraIndex + 1, oldState.length),
        ];
      });
    }
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    setFoodQuantity(oldState => oldState + 1);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    if (foodQuantity > 1) {
      setFoodQuantity(oldState => oldState - 1);
    }
  }

  const toggleFavorite = useCallback(async () => {
    // Toggle if food is favorite or not
    try {
      if (isFavorite) {
        await api.delete(`favorites/${food.id}`);
      } else {
        await api.post('favorites', food);
      }

      setIsFavorite(oldState => !oldState);
    } catch (err) {
      console.log(err);
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    const extraTotal = extras.reduce((cumulator, extraItem) => {
      cumulator += extraItem.quantity * extraItem.value;
      return cumulator;
    }, 0);
    const foodTotal = food.price * foodQuantity;

    return formatValue(extraTotal + foodTotal);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    try {
      await api.post('orders', { ...food, extras });
    } catch (err) {
      console.log(err);
    }
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
