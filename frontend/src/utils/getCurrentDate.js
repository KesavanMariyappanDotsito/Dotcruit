export const getCurrentDate = () => {
    const pad = (num) => num.toString().padStart(2, '0'); 
    const currentdate = new Date();
    return pad(currentdate.getDate()) + "/"
        + pad(currentdate.getMonth() + 1) + "/"
        + currentdate.getFullYear() + " "
        + pad(currentdate.getHours()) + ":"
        + pad(currentdate.getMinutes()) + ":"
        + pad(currentdate.getSeconds());
}