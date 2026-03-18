import { useParams } from "react-router-dom"; export default function OrderDetail() { const { id } = useParams(); return <div className="p-4">Order Detail {id}</div>; }
