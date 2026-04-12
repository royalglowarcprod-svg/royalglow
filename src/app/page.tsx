import NavBar from "../components/navbar";
import SearchBar from "../components/searchBar";
import Banner from "../components/banner";
import Page from "../components/cardDisplay";
import CategoryCircles from "@/components/categoryCircles";
import InfiniteCarousel from "@/components/infiniteCarousel";
import WhatsAppButton from "@/components/whatsappButton";

export default function Home() {
  return (
    <div className="main">
      <NavBar />
      <SearchBar />
      <CategoryCircles />
      <InfiniteCarousel />
      <Banner />
      <WhatsAppButton />
      <Page />
    </div>
  );
}
