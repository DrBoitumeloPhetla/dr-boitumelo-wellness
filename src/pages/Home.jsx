import Hero from '../components/sections/Hero';
import About from '../components/sections/About';
import MediaSection from '../components/sections/MediaSection';
import Products from '../components/sections/Products';
import Services from '../components/sections/Services';
import EmployeeWellness from '../components/sections/EmployeeWellness';
import Credentials from '../components/sections/Credentials';
import Testimonials from '../components/sections/Testimonials';
import Contact from '../components/sections/Contact';

const Home = () => {
  return (
    <main>
      <Hero />
      <About />
      <MediaSection />
      <Products />
      <Services />
      <EmployeeWellness />
      <Credentials />
      <Testimonials />
      <Contact />
    </main>
  );
};

export default Home;
