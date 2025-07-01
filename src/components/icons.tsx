import { GraduationCap, type LucideProps } from "lucide-react"

export const Icons = {
  logo: (props: LucideProps) => <GraduationCap {...props} />,
  google: (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>Google</title>
      <path
        fill="currentColor"
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-4.73 1.9-3.87 0-7-3.13-7-7s3.13-7 7-7c2.25 0 3.67.9 4.54 1.72l2.4-2.4C17.82 2.76 15.12 2 12.48 2 7.43 2 3.23 6.2 3.23 11.2s4.2 9.2 9.25 9.2c2.97 0 5.42-1 7.2-2.73 1.84-1.84 2.5-4.45 2.5-7.75 0-.57-.05-.92-.12-1.32H12.48z"
      />
    </svg>
  ),
}
