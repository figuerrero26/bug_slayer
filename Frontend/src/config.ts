export const API_URL: string = "http://181.79.5.78:8001";
export default API_URL;

/*const API_URL = "http://181.79.5.78:8001"
//test
export default API_URL    -----> Esta línea se ha editado para corregir la extensión del archivo de configuración, que es .ts y no .tsx. El error se debía a que el import en Login.tsx estaba buscando un archivo con extensión .tsx, lo cual no existía. Ahora el import apunta correctamente a config.ts, que es el archivo donde se define API_URL.

*/ 