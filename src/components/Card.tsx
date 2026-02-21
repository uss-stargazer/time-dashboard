import { Box, type BoxProps } from "@mui/material";
import type { PropsWithChildren } from "react";

function Card({
  children,
  fullWidth,
  faded,
  ...props
}: PropsWithChildren<BoxProps & { fullWidth?: boolean; faded?: boolean }>) {
  return (
    <Box
      {...props}
      sx={{
        p: "1rem",
        maxWidth: "25em",
        width: fullWidth ? "25em" : undefined,
        border: "1px solid",
        borderColor: "primary.dark",
        borderRadius: "7px",
        bgcolor: faded ? "background.main" : "grey.900",
        ...props.sx,
      }}
    >
      {children}
    </Box>
  );
}

export default Card;
