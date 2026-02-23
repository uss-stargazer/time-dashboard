import { Box, Typography, type BoxProps } from "@mui/material";
import type { PropsWithChildren } from "react";

function Card({
  children,
  label,
  fullWidth,
  faded,
  ...props
}: PropsWithChildren<
  BoxProps & { label?: string; fullWidth?: boolean; faded?: boolean }
>) {
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
        position: "relative",
        mt: label && "14px",
        ...props.sx,
      }}
    >
      {label && (
        <Typography
          variant="caption"
          color="primary"
          sx={{
            position: "absolute",
            fontSize: 12,
            top: -18,
            left: 12,
            zIndex: 1,
          }}
        >
          {label}
        </Typography>
      )}

      {children}
    </Box>
  );
}

export default Card;
