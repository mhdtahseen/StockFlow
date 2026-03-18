import { useParams } from "react-router-dom"; export default function CustomerDetail() { const { id } = useParams(); return <div className="p-4">Customer Detail {id}</div>; }
