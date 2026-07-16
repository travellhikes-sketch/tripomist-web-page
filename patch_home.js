const fs = require('fs');

let c = fs.readFileSync('react-app/src/pages/Home.jsx', 'utf8');

if (!c.includes("import FeaturedTripCard")) {
  c = c.replace(
    "import PackageCard from '../components/PackageCard'",
    "import PackageCard from '../components/PackageCard'\nimport FeaturedTripCard from '../components/FeaturedTripCard'"
  );
}

if (!c.includes("EffectCoverflow")) {
  c = c.replace(
    "import { Autoplay } from 'swiper/modules'",
    "import { Autoplay, EffectCoverflow } from 'swiper/modules'"
  );
}

if (!c.includes("import 'swiper/css/effect-coverflow'")) {
  c = c.replace(
    "import 'swiper/css';",
    "import 'swiper/css';\nimport 'swiper/css/effect-coverflow';"
  );
}

const targetDiv = `<div className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
            <PackageCard className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px]" 
              tripTitle="Ladakh Expedition" 
              price="₹24,999" 
              duration="6N/7D" 
              description="Experience the raw beauty of Leh, Nubra Valley, and Pangong Tso with a close-knit group of adventurers."
              bg="https://images.unsplash.com/photo-1581793746485-04698e79a4e8?w=1600&q=80"
              link="/itinerary/Ladakh" 
              label="Best Seller"
            />
            <PackageCard className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px]" 
              tripTitle="Winter Spiti Circuit" 
              price="₹16,999" 
              duration="5N/6D" 
              description="Brave the frozen landscapes of the middle land. A curated winter adventure for the bold."
              bg="https://images.unsplash.com/photo-1549257850-25e24bcf0e13?w=1600&q=80"
              link="/itinerary/Spiti Valley" 
            />
            <PackageCard className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px]" 
              tripTitle="Kashmir Retreat" 
              price="₹19,999" 
              duration="4N/5D" 
              description="Explore Srinagar, Gulmarg, and Pahalgam. A perfect mix of leisure and breathtaking vistas."
              bg="https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1600&q=80"
              link="/itinerary/Kashmir" 
            />
            <PackageCard className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px]" 
              tripTitle="Rajasthan Royalty" 
              price="₹22,999" 
              duration="6N/7D" 
              description="Discover the majestic forts, stunning palaces, and vast deserts of historic Rajasthan."
              bg="https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80"
              link="/group-trips" 
            />
          </div>`;

const replacement = `<div className="w-full relative pb-12 -mx-4 px-4 md:mx-0 md:px-0 overflow-hidden">
            <Swiper
              effect={'coverflow'}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={'auto'}
              initialSlide={2}
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 100,
                modifier: 2,
                slideShadows: false,
              }}
              modules={[EffectCoverflow]}
              className="featured-swiper !pt-8 !pb-12"
            >
              <SwiperSlide className="!w-auto">
                <FeaturedTripCard className="w-[280px] md:w-[320px] h-[380px] md:h-[420px]" 
                  tripTitle="Kedarnath" 
                  price="₹14,999" 
                  duration="5N/6D" 
                  description="Embark on a spiritual journey to the majestic Kedarnath temple amidst the Garhwal Himalayas."
                  bg="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1600&q=80"
                  link="/group-trips" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <FeaturedTripCard className="w-[280px] md:w-[320px] h-[380px] md:h-[420px]" 
                  tripTitle="Madhyameshwar" 
                  price="₹12,999" 
                  duration="4N/5D" 
                  description="Discover the serene beauty and spiritual aura of the mystical Madhyameshwar temple trek."
                  bg="https://images.unsplash.com/photo-1614531341773-3bff8b7cb3fc?w=1600&q=80"
                  link="/group-trips" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <FeaturedTripCard className="w-[280px] md:w-[320px] h-[380px] md:h-[420px]" 
                  tripTitle="Ladakh" 
                  price="₹21,999" 
                  duration="6N/7D" 
                  description="Experience the raw beauty of Leh, Nubra Valley, and Pangong Tso with a close-knit group of adventurers."
                  bg="https://images.unsplash.com/photo-1581793746485-04698e79a4e8?w=1600&q=80"
                  link="/itinerary/Ladakh" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <FeaturedTripCard className="w-[280px] md:w-[320px] h-[380px] md:h-[420px]" 
                  tripTitle="Spiti Valley" 
                  price="₹16,999" 
                  duration="5N/6D" 
                  description="Brave the frozen landscapes of the middle land. A curated winter adventure for the bold."
                  bg="https://images.unsplash.com/photo-1549257850-25e24bcf0e13?w=1600&q=80"
                  link="/itinerary/Spiti Valley" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <FeaturedTripCard className="w-[280px] md:w-[320px] h-[380px] md:h-[420px]" 
                  tripTitle="Kashmir" 
                  price="₹17,999" 
                  duration="4N/5D" 
                  description="Explore Srinagar, Gulmarg, and Pahalgam. A perfect mix of leisure and breathtaking vistas."
                  bg="https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1600&q=80"
                  link="/itinerary/Kashmir" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <FeaturedTripCard className="w-[280px] md:w-[320px] h-[380px] md:h-[420px]" 
                  tripTitle="Andaman Retreat" 
                  price="₹25,999" 
                  duration="5N/6D" 
                  description="Relax on the pristine beaches of Havelock and Neil Islands with amazing scuba diving opportunities."
                  bg="https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=1600&q=80"
                  link="/group-trips" 
                />
              </SwiperSlide>
            </Swiper>
          </div>`;

c = c.replace(targetDiv, replacement);

fs.writeFileSync('react-app/src/pages/Home.jsx', c);
