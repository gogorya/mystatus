// UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "./ui/dialog";
import { Separator } from "./ui/separator";

// Clerk utilities
import { SignedIn } from "@clerk/nextjs";

export default function Dashboard({ props, children }) {
  return (
    <Card className="min-h-[750px] mt-10 mb-5 flex flex-col">
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle className="text-lg">{props.title}</CardTitle>
          <CardDescription className="text-md">
            {props.description}
          </CardDescription>
        </div>
        <SignedIn>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                onClick={props.handleCreate}
                className={props.buttonClass}
              >
                Create
              </Button>
            </DialogTrigger>
            {props.dialogContent}
          </Dialog>
        </SignedIn>
        {props.refreshButton}
      </CardHeader>

      <Separator />

      <CardContent className="flex flex-1 justify-center mt-7">
        {children}
      </CardContent>
    </Card>
  );
}
