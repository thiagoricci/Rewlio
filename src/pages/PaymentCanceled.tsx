import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default function PaymentCanceled() {
  const navigate = useNavigate();

  return (
    <>
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Payment Canceled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Your payment was canceled. No charges were made to your account.
            </p>
            <div className="flex gap-4 pt-4">
              <Button onClick={() => navigate("/credits")} variant="outline" className="flex-1">
                Back to Credits
              </Button>
              <Button onClick={() => navigate("/dashboard")} className="flex-1">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
