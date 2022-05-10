import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
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

  // \/ LÓGICA PARA NÃO USAR O "localStorage.setItem" AO FIM DAS FUNÇÕES (escalabilidade) \/
  // usando o useRef para monitorar um estado
  const prevCardRef = useRef<Product[]>();
  // pego o valor atual do carrinho
  useEffect(() => {
    prevCardRef.current = cart;
  })
  // na primeira vez vai selecionar o da direita para que não seja undefined
  //após isso  escolherá o da esquerda
  const cartPreviousValue = prevCardRef.current ?? cart;
  // faço a verificação de que se houve ou não alteração no carrinho e
  //caso ocorra ele atualizará o valor da referẽncia para o novo valor do carrinho
  //fazendo isso através do localStorage.setItem
  useEffect(() => {
    if (cartPreviousValue !== cart) {
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    }
  }, [cart, cartPreviousValue]);

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      //verifico se tem o produto no array (carrinho)
      const productExists = updatedCart.find(product => product.id === productId);

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
        updatedCart.push(newProduct);
      }
      // adiciono os dados no estado
      setCart(updatedCart);
      // salvo os dados na LocalStorage API (no useRef agora)

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      //retorna -1 se não encontrar
      const productIndex = updatedCart.findIndex(product => product.id === productId);

      if (productIndex >= 0) {
        updatedCart.splice(productIndex, 1);
        setCart(updatedCart);
        // salvo os dados na LocalStorage API (no useRef agora)
      } else {
        //forçar um erro para que ele vá direto para o catch
        throw Error();
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // se a quantidade do produto que tento atualizar for menor ou iguala zero eu paro a função
      if (amount <= 0) {
        return;
      }

      const stock = await api.get(`/stock/${productId}`);

      const strockAmount = stock.data.amount;

      if (amount > strockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);

      if (productExists) {
        productExists.amount = amount;
        setCart(updatedCart);
        // salvo os dados na LocalStorage API (no useRef agora)
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
