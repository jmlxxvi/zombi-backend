## JSON to Typescript

To be able to check at runtime the schema of the data that comes from outside of the system (aka from the user) we use JSON Schema files located on the *schemas* directory on each *api* directory, for example *app/system/public/api/schemas*

We also want to have the same verification at develpment time using Typescript type definitions but, to prevent us to create those files with the same contents as the JSON Schema files, we create the Typescript definitions files from the JSON Schema files automatically.

There is an script *json2ts.ts* that takes all files on the *schemas* directories and create a Typescript file for each JSON Schema file it enconunters.

To execute this script run:

```bash
npm run schemas
```

For example if there is a file *apps/system/public/api/schemas/login.input.json* the script will create the file *apps/system/public/api/schemas/login.input.ts* with the Typescript definitions that match the JSON file.

Then we just need to include those Typescript files on the API functions files to have the same definition we use to validate the input (or output) data, for example:

```typescript
import type { InputSystemPublicLogin } from "./schemas/login.input";
```