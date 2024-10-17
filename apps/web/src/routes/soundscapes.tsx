import { CategoryList } from "@/components/soundscape/categories/category-list";
import { SoundList } from "@/components/soundscape/sound-list/sound-list";
import { AppLayout } from "@/layouts/app-layout";

const Soundscapes = () => {
  return (
    <AppLayout>
      <CategoryList />
      <SoundList />
    </AppLayout>
  );
};

export default Soundscapes;
