import { gql } from "@apollo/client";

// ===== CART OPERATIONS =====
export const GET_CART = gql`
  query GetOrderCart {
    orderCart {
      items {
        dishId
        dishName
        dishImage
        price
        quantity
        notes
      }
      totalAmount
    }
  }
`;

export const ADD_DISH_TO_CART = gql`
  mutation AddDishToOrderCart($input: OrderItemInput!) {
    addDishToOrderCart(input: $input) {
      items {
        dishId
        dishName
        dishImage
        price
        quantity
        notes
      }
      totalAmount
    }
  }
`;

export const UPDATE_ITEM_QUANTITY = gql`
  mutation UpdateItemQuantity($dishId: ID!, $quantity: Int!) {
    updateItemQuantity(dishId: $dishId, quantity: $quantity) {
      items {
        dishId
        dishName
        dishImage
        price
        quantity
        notes
      }
      totalAmount
    }
  }
`;

export const UPDATE_ITEM_NOTES = gql`
  mutation UpdateItemNotes($dishId: ID!, $input: UpdateItemNotesInput!) {
    updateItemNotes(dishId: $dishId, input: $input) {
      items {
        dishId
        dishName
        dishImage
        price
        quantity
        notes
      }
      totalAmount
    }
  }
`;

export const REMOVE_ITEM_FROM_CART = gql`
  mutation RemoveItemFromCart($dishId: ID!) {
    removeItemFromCart(dishId: $dishId) {
      items {
        dishId
        dishName
        dishImage
        price
        quantity
        notes
      }
      totalAmount
    }
  }
`;

// ===== ORDER OPERATIONS =====
export const CREATE_ORDER = gql`
  mutation CreateOrder($input: OrderInput!) {
    createOrder(input: $input)
  }
`;

export const GET_ORDERS = gql`
  query GetOrders {
    orders {
      orderId
      customerName
      tableNumber
      status
      totalAmount
      paymentStatus
      items {
        dishId
        quantity
        notes
        dishName
        price
      }
    }
  }
`;

export const GET_ORDER = gql`
  query GetOrder($orderId: ID!) {
    order(orderId: $orderId) {
      orderId
      customerName
      tableNumber
      status
      totalAmount
      paymentStatus
      items {
        dishId
        quantity
        notes
        dishName
        price
      }
    }
  }
`;

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($orderId: ID!, $input: UpdateOrderStatusInput!) {
    updateOrderStatus(orderId: $orderId, input: $input)
  }
`;

export const GET_ORDER_PAYMENT_DETAILS = gql`
  query GetOrderPaymentDetails($orderId: ID!) {
    orderPaymentDetails(orderId: $orderId) {
      orderId
      totalAmount
      items {
        dishId
        quantity
        notes
        dishName
        price
      }
      paymentStatus
      paymentMethod
      paymentDate
    }
  }
`;

export const GET_PAYMENT_NOTIFICATION_STATUS = gql`
  query GetPaymentNotificationStatus($orderId: ID!) {
    paymentNotificationStatus(orderId: $orderId) {
      orderId
      notified
      notificationDate
    }
  }
`;

// ===== MENU OPERATIONS =====
export const GET_MENU = gql`
  query GetMenu {
    categories {
      id
      name
      description
      dishes {
        id
        name
        description
        price
        image
        ingredients
        allergens
        available
        featured
      }
    }
  }
`;

export const GET_CATEGORY = gql`
  query GetCategory($categoryId: ID!) {
    category(id: $categoryId) {
      id
      name
      description
      dishes {
        id
        name
        description
        price
        image
        ingredients
        allergens
        available
        featured
      }
    }
  }
`;

export const GET_DISH = gql`
  query GetDish($dishId: ID!) {
    dish(id: $dishId) {
      id
      name
      description
      price
      image
      ingredients
      allergens
      available
      featured
      categoryId
    }
  }
`;
