import React, { useEffect } from 'react'
import "./ProductSummary.scss";
import { AiFillDollarCircle } from 'react-icons/ai';
import { BsCart4, BsCartX } from "react-icons/bs";
import { BiCategory } from 'react-icons/bi';
import InfoBook from '../../infoBook/InfoBook';
import { useDispatch, useSelector } from 'react-redux';
import { CALC_CATEGORY, CALC_OUTOFSTOCK, CALC_STORE_VALUE, selectCategory, selectOutOfStock, selectTotalStoreValue } from '../../../redux/features/product/productSlice';

// Icons
const earningIcon = <AiFillDollarCircle size={40} color='#fff' />
const productIcon = <BsCart4 size={40} color='#fff' />
const categoryIcon = <BiCategory size={40} color='#fff' />
const outOfStockIcon = <BsCartX size={40} color='#fff' />

export const formatNumbers = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const ProductSummary = ({ products }) => {
    const dispatch = useDispatch();
    const totalStoreValue = useSelector(selectTotalStoreValue)
    const outofStock = useSelector(selectOutOfStock)
    const category = useSelector(selectCategory)

    useEffect(() => {
        dispatch(CALC_STORE_VALUE(products))
        dispatch(CALC_OUTOFSTOCK(products))
        dispatch(CALC_CATEGORY(products))
    }, [dispatch, products])

    return (
        <div className='product-summary'>
            <h3 className='--mt'>Inventory Stats</h3>
            <div className="info-summary">
                <InfoBook
                    icon={productIcon}
                    title={"Total Product"}
                    count={products.length}
                    bgColor="card1"
                />
                <InfoBook
                    icon={earningIcon}
                    title={"Total Store Value"}
                    count={`$${formatNumbers(totalStoreValue.toFixed(2))}`}
                    bgColor="card2"
                />
                <InfoBook
                    icon={outOfStockIcon}
                    title={"Out of Stock"}
                    count={outofStock}
                    bgColor="card3"
                />
                <InfoBook
                    icon={categoryIcon}
                    title={"All Categories"}
                    count={category.length}
                    bgColor="card4"
                />
            </div>
        </div>
    )
}

export default ProductSummary
