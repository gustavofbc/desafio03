import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCard = [...cart];
      //verifico se tem o produto no array (carrinho)
      const productExists = updatedCard.find(product => product.id === productId);

      // busco os dados no estoque
      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      // se a quantidade solicitada é maior do que se tem em estoque
      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      // se existe o produto no array (carrinho), adiciono +1 a ele
      if (productExists) {
        productExists.amount = amount;
        // se não, eu adiciono o produto no array (carrinho)
      } else {
        const product = await api.get(`/products/${productId}`);
        // como não tem o "amount" na API, eu preciso inicializá-la com 1
        const newProduct = {
          ...product.data,
          amount: 1
        }
        updatedCard.push(newProduct);
      }
      // adiciono os dados no estado
      setCart(updatedCard);
      // salvo os dados na LocalStorage API
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCard));
    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
