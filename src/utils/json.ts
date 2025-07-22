export function readJsonFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                resolve(json);
            } catch (error) {
                reject(new Error("The file is not a valid JSON."));
            }
        };

        reader.onerror = () => {
            reject(new Error("Error reading the file."));
        };

        reader.readAsText(file);
    });
}
