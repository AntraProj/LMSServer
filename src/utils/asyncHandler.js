// ─── asyncHandler ───────────────────────────────────────────────────────────────
// Wraps async route handlers so you don't need try/catch in every controller.
// Any thrown error or rejected promise is automatically passed to next(err),
// which routes it to your global errorHandler middleware.
//
// Without asyncHandler — repetitive try/catch everywhere:
//   export const getTicket = async (req, res, next) => {
//     try {
//       const ticket = await ticketService.findById(req.params.id);
//       res.json(ticket);
//     } catch (err) {
//       next(err);  // ← you have to remember this in every controller
//     }
//   };
//
// With asyncHandler — clean and consistent:
//   export const getTicket = asyncHandler(async (req, res) => {
//     const ticket = await ticketService.findById(req.params.id);
//     res.json(ticket);
//     // errors are forwarded to errorHandler automatically
//   });

export const asyncHandler = (fn) => (req, res, next) => {
    fn(req, res, next).catch(next);
};