import React, { useState } from 'react'
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './ProductForm.scss'
import Card from '../../card/Card';

const ProductForm = ({
    product,
    productImage,
    imagePreview,
    description,
    setDescription,
    handleInputChange,
    handleImageChange,
    saveProduct,
}) => {
    const [imageError, setImageError] = useState("")

    const handleFileSelection = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            const uploadFile = file.type === "image/avif" || file.name.toLowerCase().endsWith(".avif")
                ? await convertAvifToJpeg(file)
                : file
            setImageError("")
            handleImageChange(uploadFile)
        } catch {
            setImageError("Could not process this image. Choose a JPG or PNG file.")
        }
    }

    return (
        <div className='add-product'>
            <Card cardClass={"card"}>
                <form onSubmit={saveProduct}>
                    <Card cardClass={"group"}>
                        <label>Product Image</label>
                        <code className='--color-dark'>Supported Formats: jpg, jpeg, png, avif</code>
                        <input type="file" name="image" accept=".jpg,.jpeg,.png,.avif" onChange={handleFileSelection} />
                        {imageError && <p role="alert">{imageError}</p>}
                        {imagePreview != null ? (
                            <div className="image-preview">
                                <img src={imagePreview} alt="Product" />
                            </div>
                        ) : (
                            <p>No image set for this product</p>
                        )}
                    </Card>
                    <label>Product Name:</label>
                    <input type="text" placeholder='Product Name' name='name' value={product?.name} onChange={handleInputChange} />

                    <label>Product Category:</label>
                    <input type="text" placeholder='Product Category' name='category' value={product?.category} onChange={handleInputChange} />

                    <label>Product Price:</label>
                    <input type="text" placeholder='Product Price' name='price' value={product?.price} onChange={handleInputChange} />

                    <label>Product Quantity:</label>
                    <input type="text" placeholder='Product Quantity' name='quantity' value={product?.quantity} onChange={handleInputChange} />

                    <label>Product Description:</label>
                    <ReactQuill theme="snow" value={description} onChange={setDescription} modules={ProductForm.modules} formats={ProductForm.formats} />

                    <div className="--my">
                        <button type='submit' className="--btn --btn-primary">
                            Save Product
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    )
}

const convertAvifToJpeg = (file) => new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight
        const context = canvas.getContext("2d")

        if (!context) {
            URL.revokeObjectURL(imageUrl)
            reject(new Error("Could not process image"))
            return
        }

        context.fillStyle = "#fff"
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0)
        canvas.toBlob((blob) => {
            URL.revokeObjectURL(imageUrl)
            if (!blob) {
                reject(new Error("Could not process image"))
                return
            }
            resolve(new File([blob], file.name.replace(/\.avif$/i, ".jpg"), { type: "image/jpeg" }))
        }, "image/jpeg", 0.92)
    }

    image.onerror = () => {
        URL.revokeObjectURL(imageUrl)
        reject(new Error("Could not process image"))
    }
    image.src = imageUrl
})

ProductForm.modules = {
    toolbar: [
        [{ header: "1" }, { header: "2" }, { font: [] }],
        [{ size: [] }],
        ["bold", "italic", "underline", "strike", "blockquote"],
        [{ align: [] }],
        [{ color: [] }, { background: [] }],
        [
            { list: "orderd" },
            { list: "bullet" },
            { indent: "-1" },
            { indent: "+1" },
        ],
        ["clean"],
    ],
};
ProductForm.formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "color",
    "background",
    "list",
    "bullet",
    "indent",
    "link",
    "video",
    "image",
    "code-block",
    "align",
];


export default ProductForm;
