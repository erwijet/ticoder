/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const logger = {
    log(msg: any) {
        console.log(msg);
    },
    error(err: any) {
        console.error(err);
    },
};
