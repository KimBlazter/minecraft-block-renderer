import { useState } from "react";

export default function FileInputs({
    onChange,
}: {
    onChange: (files: { model?: File; texture?: File }) => void;
}) {
    const [files, setFiles] = useState<{ model?: File; texture?: File }>({});

    const handleChange = (
        type: "model" | "texture",
        file: File | undefined,
    ) => {
        const newFiles = { ...files, [type]: file };
        setFiles(newFiles);
        onChange(newFiles);
    };

    return (
        <div className="absolute top-0 right-0 w-72 flex flex-col bg-gray-600 p-4 m-4 gap-2 text-white rounded text-sm">
            <div>
                <label htmlFor="modelFile" className="fileinput-label">
                    Model:
                </label>
                <input
                    type="file"
                    name="modelFile"
                    id="modelFile"
                    className="fileinput"
                    accept="application/json"
                    onChange={(e) => handleChange("model", e.target.files?.[0])}
                />
            </div>

            <div>
                <label htmlFor="textureFile" className="fileinput-label">
                    Texture:
                </label>
                <input
                    type="file"
                    name="textureFile"
                    id="textureFile"
                    className="fileinput"
                    accept="image/*"
                    onChange={(e) =>
                        handleChange("texture", e.target.files?.[0])
                    }
                />
            </div>
        </div>
    );
}
