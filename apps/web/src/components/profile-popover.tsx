import { IDENTITY_COLORS, type Profile, profileSchema } from "@kresliarska/shared";
import { type FormEvent, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

type ProfilePopoverProps = {
  profile: Profile;
  onSave: (profile: Profile) => void;
  children: ReactNode;
};

export const ProfilePopover = ({ profile, onSave, children }: ProfilePopoverProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(profile);
  const valid = profileSchema.safeParse(draft).success;

  const handleOpenChange = (next: boolean): void => {
    if (next) {
      setDraft(profile);
    }
    setOpen(next);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const parsed = profileSchema.safeParse(draft);
    if (!parsed.success) {
      return;
    }
    onSave(parsed.data);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <PopoverHeader>
          <PopoverTitle>Your profile</PopoverTitle>
        </PopoverHeader>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <Input
            aria-label="Display name"
            maxLength={40}
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Color</legend>
            {IDENTITY_COLORS.map((color) => (
              <label key={color} className="cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value={color}
                  checked={draft.color === color}
                  onChange={() => setDraft({ ...draft, color })}
                  className="peer sr-only"
                />
                <span className="sr-only">{color}</span>
                <span
                  aria-hidden
                  className="block size-6 rounded-full ring-offset-2 ring-offset-popover peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
                  style={{ backgroundColor: color }}
                />
              </label>
            ))}
          </fieldset>
          <Button type="submit" size="sm" disabled={!valid}>
            Save
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
};
