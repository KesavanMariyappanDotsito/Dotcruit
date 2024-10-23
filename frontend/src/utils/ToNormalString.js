export function toNormalString(str) {
    return str
        .replace(/([A-Z])/g, ' $1') // Add space before each uppercase letter
        .replace(/^./, function(char) { return char.toUpperCase(); }) // Capitalize the first letter
        .trim(); // Remove any leading or trailing spaces
}