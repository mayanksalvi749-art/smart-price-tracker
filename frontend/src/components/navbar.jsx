export default function Navbar(){

return(

<nav className="bg-white shadow p-4 flex justify-between">

<h1 className="text-2xl font-bold">
SmartPrice
</h1>

<input
placeholder="Search products"
className="border p-2 w-[500px]"
/>

<div>

<button className="mr-3">
Wishlist
</button>

<button>
Profile
</button>

</div>

</nav>

)

}