import { CategoryList } from "@/components/soundscape/categories/category-list";
import { SoundList } from "@/components/soundscape/sound-list/sound-list";
import { AppLayout } from "@/layouts/app-layout";

const Soundscapes = () => {
  return (
    <AppLayout>
      <div className="p-6">
        <CategoryList />
        <SoundList />
      </div>
    </AppLayout>
  );
};

export default Soundscapes;
