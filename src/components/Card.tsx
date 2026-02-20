import { Box, type BoxProps } from "@mui/material";
import type { PropsWithChildren } from "react";

function Card({
  children,
  fullWidth,
  ...props
}: PropsWithChildren<BoxProps & { fullWidth?: boolean }>) {
  return (
    <Box
      {...props}
      sx={{
        ...props.sx,
        p: "1rem",
        maxWidth: "25em",
        width: fullWidth ? "25em" : undefined,
        border: "1px solid",
        borderColor: "primary.dark",
        borderRadius: "7px",
      }}
    >
      {children}
    </Box>
  );
}

export default Card;
