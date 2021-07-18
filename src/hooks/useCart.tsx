import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

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
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productAlreadyExists = cart.find(
        (product) => product.id === productId
      );

      const stock = await api.get(`/stock/${productId}`);
      const product = await api.get(`/products/${productId}`);

      if (productAlreadyExists) {
        if (productAlreadyExists.amount + 1 > stock.data.amount) {
          toast.error("Quantidade solicitada fora de estoque");

          return;
        } else {
          const newCart = cart.map((cartProduct) =>
            cartProduct.id === productId
              ? {
                  ...cartProduct,
                  amount: cartProduct.amount + 1,
                }
              : cartProduct
          );

          setCart(newCart);

          localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        }
      } else {
        const newProduct = { ...product.data, amount: 1 };

        const newCart = [...cart];
        newCart.push(newProduct);

        setCart(newCart);

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find((product) => product.id === productId);

      if (!productExists) {
        toast.error("Erro na remoção do produto");
        return;
      }

      const newCart = cart.filter((product) => product.id !== productId);
      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const stock = await api.get(`/stock/${productId}`);
      if (amount > stock.data.amount) {
        toast.error("Quantidade solicitada fora de estoque");

        return;
      }

      const newCart = cart.map((cartProduct) =>
        cartProduct.id === productId
          ? {
              ...cartProduct,
              amount: amount,
            }
          : cartProduct
      );

      setCart(newCart);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
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
