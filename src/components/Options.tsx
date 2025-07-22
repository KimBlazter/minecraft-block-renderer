import { LuGrid3X3, LuRotate3D } from "react-icons/lu";
import { PiVectorThreeBold } from "react-icons/pi";
import { useOptions } from "../stores/options";

export default function Options() {
    const options = useOptions();

    return (
        <div className="absolute bottom-0 right-0 w-72 flex flex-col bg-gray-600 p-4 m-4 gap-4 text-white text-sm rounded-md">
            <label className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={options.showGrid}
                    onChange={() => options.toggleShowGrid()}
                />
                <LuGrid3X3 size={18} /> Show grid
            </label>

            <label className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={options.autoRotate}
                    onChange={() => options.toggleAutoRotate()}
                    className="flex flex-row items-center gap-1"
                />
                <LuRotate3D size={18} /> Auto rotation
            </label>

            <label className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={options.showAxes}
                    onChange={() => options.toggleShowAxes()}
                />
                <PiVectorThreeBold size={18} /> Show axes
            </label>
        </div>
    );
}
