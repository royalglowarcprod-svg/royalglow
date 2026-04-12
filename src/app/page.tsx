import NavBar from "../components/navbar";
import Banner from "../components/banner";
import Page from "../components/cardDisplay";
import CategoryCircles from "@/components/categoryCircles";
import InfiniteCarousel from "@/components/infiniteCarousel";
import WhatsAppButton from "@/components/whatsappButton";
import SearchBar from "@/components/searchBar";

export default function Home() {
  return (
    <div className="main">
      <NavBar />
     
      <CategoryCircles />
      <SearchBar />
      <InfiniteCarousel />
      <Banner />
      <WhatsAppButton />
      <Page />
    </div>
  );
}
