import React, { useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useLazyQuery } from '@apollo/client';
import { QUERY_CHECKOUT } from '../../utils/queries';
import { idbPromise } from '../../utils/helpers';
import CartItem from '../cartproducts';
import Auth from '../../utils/auth';
import { useStoreContext } from '../../utils/globalstate';
import { TOGGLE_CART, ADD_MULTIPLE_TO_CART } from '../../utils/action';
import './style.css';
import {ShoppingCartOutlined} from '@ant-design/icons'

const stripePromise = loadStripe('pk_test_51N4I0bGpCDQTXt0mDgIsWRClLx1kBz6Cr6nyeu0klpbivKJxUEHZMGTIo7psaNqL3TvMKwYaCGmXDrmyUtfQRWBU00aNpRfiPM');

const Cart = () => {
  const [state, dispatch] = useStoreContext();
  const [getCheckout, { data }] = useLazyQuery(QUERY_CHECKOUT);

  useEffect(() => {
    if (data) {
      stripePromise.then((res) => {
        res.redirectToCheckout({ sessionId: data.checkout.session });
      });
    }
  }, [data]);

  useEffect(() => {
    async function getCart() {
      const cart = await idbPromise('cart', 'get');
      dispatch({ type: ADD_MULTIPLE_TO_CART, products: [...cart] });
    };

    if (!state.cart.length) {
      getCart();
    }
  }, [state.cart.length, dispatch]);

  function toggleCart() {
    dispatch({ type: TOGGLE_CART });
  }

  function calculateTotal() {
    let sum = 0;
    state.cart.forEach((item) => {
      sum += item.price * item.purchaseQuantity;
    });
    return sum.toFixed(2);
  }

  function submitCheckout() {
    const productIds = [];

    state.cart.forEach((item) => {
      for (let i = 0; i < item.purchaseQuantity; i++) {
        productIds.push(item._id);
      }
    });

    getCheckout({
      variables: { products: productIds },
    });
  }

  if (!state.cartOpen) {
    return (
      <div className="cart-closed" onClick={toggleCart}>
        <ShoppingCartOutlined style={{color: 'white', fontSize:40}}/>
          
      </div>
    );
  }

  return (
    <div className="cart">
      <div className="close" onClick={toggleCart}>
        [x]
      </div>
      <h2>Cart</h2>
      {state.cart.length ? (
        <div>
          {state.cart.map((item) => (
            <CartItem key={item._id} item={item} />
          ))}

          <div className="flex-row space-between">
            <strong>Total: ${calculateTotal()}</strong>

            {Auth.loggedIn() ? (
              <button onClick={submitCheckout}>Checkout</button>
            ) : (
              <span>(Log in!)</span>
            )}
          </div>
        </div>
      ) : (
        <h3>
        
          Add some items to your cart!
        </h3>
      )}
    </div>
  );
};

export default Cart;



