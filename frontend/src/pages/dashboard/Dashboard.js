import React, { useEffect } from 'react'
import useRedirectLogggedUser from '../../customHook/useRedirectLoggedOutUser'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsLoggedIn } from '../../redux/features/auth/authSlice'
import { getProducts } from '../../redux/features/product/productSlice'
import ProductList from '../../components/product/productList/ProductList'
import ProductSummary from '../../components/product/productSummary/ProductSummary'


const Dashboard = () => {

  useRedirectLogggedUser("/login")
  const dispatch = useDispatch()

  const isLoggedIn = useSelector(selectIsLoggedIn)

  const { products, isLoading, isError, message } = useSelector((state) => state.product);
  //console.log(isLoading);

  useEffect(() => {
    if (isLoggedIn === true) {
      dispatch(getProducts());
    }
    //console.log(products);

    if (isError) {
      console.log(message);
    }
  }, [isLoggedIn, isError, message, dispatch, products])

  return (
    <div>
      <ProductSummary products={products} />
      <ProductList products={products} isLoadingI={isLoading} />
    </div>
  )
}

export default Dashboard
